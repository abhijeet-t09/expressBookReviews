const express = require('express');
const jwt = require('jsonwebtoken');
const regd_users = express.Router();

let users = [];
let books = require("./booksdb.js");
const secretKey = "your_secret_key"; // Use a strong secret key in a real application

// Function to check if username is valid
const isValid = (username) => {
    return users.some(user => user.username === username);
}

// Function to check if username and password match
const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
}

// Login route
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if username and password are valid
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate a JWT token
    const accessToken = jwt.sign({ username }, secretKey, { expiresIn: '1h' });

    // Save the token in the session
    req.session.accessToken = accessToken;

    // Send a success response
    return res.status(200).json({ message: "Logged in successfully" });
});

// Add or modify a book review route
regd_users.put("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const { review } = req.query; // Get review from query params

    // Check if the user is authenticated
    if (!req.session.accessToken) {
        return res.status(403).json({ message: "Unauthorized access" });
    }

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the review is provided
    if (!review) {
        return res.status(400).json({ message: "Review is required" });
    }

    // Extract the username from the JWT token
    jwt.verify(req.session.accessToken, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const username = decoded.username;

        // Add or update the review for the specified book
        books[isbn].reviews[username] = review;

        return res.status(200).json({ message: "Review added successfully" });
    });
});

// Delete a book review route
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;

    // Check if the user is authenticated
    if (!req.session.accessToken) {
        return res.status(403).json({ message: "Unauthorized access" });
    }

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Extract the username from the JWT token
    jwt.verify(req.session.accessToken, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const username = decoded.username;

        // Check if the review exists for the user
        if (!books[isbn].reviews[username]) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Delete the review for the user
        delete books[isbn].reviews[username];

        // Generate and send the success response
        const message = `Review for ISBN ${isbn} by ${username} deleted`;
        return res.status(200).json({ message });
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
