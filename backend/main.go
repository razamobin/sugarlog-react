package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/rs/cors"
)

type Post struct {
    ID         int    `json:"id"`
    BloodSugar int    `json:"blood_sugar"`
    Day        string `json:"day"`
    Notes      string `json:"notes"`
}

var db *sql.DB

func main() {

    var err error
    dsn := fmt.Sprintf(
        "%s:%s@tcp(%s:%s)/%s",
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_NAME"),
    )

    for {
        db, err = sql.Open("mysql", dsn)
        if err != nil {
            log.Println("Error connecting to the database. Retrying in 5 seconds...")
            time.Sleep(5 * time.Second)
            continue
        }
        err = db.Ping()
        if err != nil {
            log.Println("Database is not ready. Retrying in 5 seconds...")
            time.Sleep(5 * time.Second)
            continue
        }
        break
    }

    mux := http.NewServeMux()
    mux.HandleFunc("/posts", handlePosts)
    mux.HandleFunc("/posts/recent", handleRecentPosts)

    // Enable CORS
    handler := cors.Default().Handler(mux)

    log.Println("Server started at :8090")
    log.Fatal(http.ListenAndServe(":8090", handler))
}

func handlePosts(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodPost:
        var post Post
        if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }

        result, err := db.Exec("INSERT INTO posts (blood_sugar, date, notes) VALUES (?, ?, ?)", post.BloodSugar, post.Day, post.Notes)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        id, err := result.LastInsertId()
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        post.ID = int(id)
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(post)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func handleRecentPosts(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("select id, blood_sugar, DATE_FORMAT(date, '%Y-%m-%d') as day, notes from posts order by date desc, id desc limit 10")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var posts []Post
    for rows.Next() {
        var post Post
        err := rows.Scan(&post.ID, &post.BloodSugar, &post.Day, &post.Notes)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        posts = append(posts, post)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(posts)
}

