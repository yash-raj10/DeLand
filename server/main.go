package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type LedgerEntry struct {
	ID             string `bson:"id" json:"id"`
	SurveyNumber   string `bson:"survey_number" json:"survey_number"`
	PropertyNumber string `bson:"property_number" json:"property_number"`
	OwnerID        string `bson:"owner_id" json:"owner_id"`
	LandType       string `bson:"land_type" json:"land_type"`
	Action         string `bson:"action" json:"action"`
	Details        string `bson:"details" json:"details"`
	Timestamp      int64  `bson:"timestamp" json:"timestamp"`
	PrevHash       string `bson:"prev_hash" json:"prev_hash"`
	Hash           string `bson:"hash" json:"hash"`
}

type NewEntryPayload struct {
	SurveyNumber   string `json:"survey_number"`
	PropertyNumber string `json:"property_number"`
	OwnerID        string `json:"owner_id"`
	LandType       string `json:"land_type"`
	Action         string `json:"action"`
	Details        string `json:"details"`
}

var ledgerCollection *mongo.Collection

func calculateHash(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func getLastHash(ctx context.Context, propertyNumber string) string {
	cur, err := ledgerCollection.Find(ctx, bson.M{"property_number": propertyNumber})
	if err != nil {
		return "genesis"
	}
	var entries []LedgerEntry
	if err := cur.All(ctx, &entries); err != nil || len(entries) == 0 {
		return "genesis"
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Timestamp < entries[j].Timestamp
	})
	return entries[len(entries)-1].Hash
}

func createEntry(ctx context.Context, payload NewEntryPayload) (*LedgerEntry, error) {
	prevHash := getLastHash(ctx, payload.PropertyNumber)
	timestamp := time.Now().Unix()
	id := uuid.New().String()
	raw := id + payload.SurveyNumber + payload.PropertyNumber + payload.OwnerID + payload.LandType + payload.Action + payload.Details + string(rune(timestamp))
	hash := calculateHash(raw + prevHash)

	entry := LedgerEntry{
		ID:             id,
		SurveyNumber:   payload.SurveyNumber,
		PropertyNumber: payload.PropertyNumber,
		OwnerID:        payload.OwnerID,
		LandType:       payload.LandType,
		Action:         payload.Action,
		Details:        payload.Details,
		Timestamp:      timestamp,
		PrevHash:       prevHash,
		Hash:           hash,
	}
	_, err := ledgerCollection.InsertOne(ctx, entry)
	return &entry, err
}

func addEntryHandler(c *gin.Context) {
	var payload NewEntryPayload
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	entry, err := createEntry(context.TODO(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "entry": entry})
}

func verifyLedgerHandler(c *gin.Context) {
	landID := c.Param("land_id")
	cur, err := ledgerCollection.Find(context.TODO(), bson.M{"survey_number": landID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var chain []LedgerEntry
	if err := cur.All(context.TODO(), &chain); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	sort.Slice(chain, func(i, j int) bool {
		return chain[i].Timestamp < chain[j].Timestamp
	})
	valid := true
	for i := 1; i < len(chain); i++ {
		prev := chain[i-1]
		curr := chain[i]
		expected := calculateHash(curr.ID + curr.SurveyNumber + curr.PropertyNumber + curr.OwnerID + curr.LandType + curr.Action + curr.Details + string(rune(curr.Timestamp)) + curr.PrevHash)
		if curr.PrevHash != prev.Hash || curr.Hash != expected {
			valid = false
			break
		}
	}
	c.JSON(http.StatusOK, gin.H{"land_id": landID, "valid": valid})
}

func getPropertyHistoryHandler(c *gin.Context) {
	property := c.Param("property_number")
	cur, err := ledgerCollection.Find(context.TODO(), bson.M{"property_number": property})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var history []LedgerEntry
	if err := cur.All(context.TODO(), &history); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(history) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Property not found"})
		return
	}
	sort.Slice(history, func(i, j int) bool {
		return history[i].Timestamp < history[j].Timestamp
	})
	c.JSON(http.StatusOK, history)
}

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables.")
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI environment variable is required")
	}
	
	// Connect to MongoDB
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	// Initialize collection
	ledgerCollection = client.Database("ledger_db" ).Collection("entries")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Failed to ping MongoDB:", err)
	}

	r := gin.Default()
	
	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
	
	r.POST("/add_entry", addEntryHandler)
	r.GET("/verify/:land_id", verifyLedgerHandler)
	r.GET("/property/:property_number", getPropertyHistoryHandler)
	
	r.Run(":" + "8080")
}
