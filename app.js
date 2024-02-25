const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5000;

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bookstore',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to the database');
    }
});

// Middleware for CORS
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('login-signup'));
app.use(express.static('compare_prices/login-signup'));


// API to get book information
app.get('/books/:bookName', (req, res) => {
    const bookName = req.params.bookName;

    const sql = `SELECT * FROM Books b
                JOIN Prices p ON b.book_id = p.book_id
                WHERE b.book_name = ?`;

    db.query(sql, [bookName], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (result.length > 0) {
                res.json(result);
            } else {
                res.status(404).json({ error: 'Book not found' });
            }
        }
    });
});

// API to handle user login
app.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    const sql = 'SELECT * FROM Users WHERE (username = ? OR email = ?) AND password = ?';
    db.query(sql, [identifier, identifier, password], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (result.length > 0) {
                res.redirect('/index.html');
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        }
    });
});

// API to handle user registration
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    const checkUsernameSql = 'SELECT * FROM Users WHERE username = ?';
    const checkEmailSql = 'SELECT * FROM Users WHERE email = ?';

    // Check if username or email is already in use
    db.query(checkUsernameSql, [username], (err, resultUsername) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (resultUsername.length > 0) {
            res.status(400).json({ error: 'Username is already in use' });
        } else {
            // Check if the email is already in use
            db.query(checkEmailSql, [email], (err, resultEmail) => {
                if (err) {
                    console.error('Database query error:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (resultEmail.length > 0) {
                    res.status(400).json({ error: 'Email is already in use' });
                } else {
                    // Insert the new user into the Users table
                    const insertUserSql = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
                    db.query(insertUserSql, [username, email, password], (err, resultInsert) => {
                        if (err) {
                            console.error('Database query error:', err);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            res.redirect('/index.html');
                        }
                    });
                }
            });
        }
    });
});

// Route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-signup', 'login.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
