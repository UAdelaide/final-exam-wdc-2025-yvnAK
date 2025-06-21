var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
    try {
        // Connect to MySQL without specifying a database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '' // Set your MySQL root password
        });

        // Create the database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
        await connection.end();

        // Now connect to the created database
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });

        // ==================Create Tables==================
        await db.execute(`
            create table if not exists Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('owner', 'walker') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.execute(`
            create table if not exists Dogs (
                dog_id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                size ENUM('small', 'medium', 'large') NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES Users(user_id)
            )
        `);
        await db.execute(`
            create table if not exists WalkRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                dog_id INT NOT NULL,
                requested_time DATETIME NOT NULL,
                duration_minutes INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
            )
        `);
        await db.execute(`
            create table if not exists WalkApplications (
                application_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                CONSTRAINT unique_application UNIQUE (request_id, walker_id)
            )
        `);
        await db.execute(`
            create table if not exists WalkRatings (
                rating_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                owner_id INT NOT NULL,
                rating INT CHECK (rating BETWEEN 1 AND 5),
                comments TEXT,
                rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                FOREIGN KEY (owner_id) REFERENCES Users(user_id),
                CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
            )
        `);
        // =================================================

        // ==================Insert Data==================
        const [userRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
        if (userRows[0].count === 0) {
            await db.execute(`
                insert into Users (username, email, password_hash, role) values
                ('alice123', 'alice@example.com', 'hashed123', 'owner'),
                ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
                ('carol123', 'carol@example.com', 'hashed789', 'owner'),
                ('jaechong345', 'jchn@example.com', 'hashbr0wn', 'owner'),
                ('kellsk295', 'klsk@example.com', 'hashbr1wn', 'walker')
            `);
        }
        const [dogRows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
        if (dogRows[0].count === 0) {
            await db.execute(`
                insert into Dogs (owner_id, name, size) values
                ((select user_id from Users where username ='alice123'), 'Max', 'medium'),
                ((select user_id from Users where username ='carol123'), 'Bella', 'small'),
                ((select user_id from Users where username ='jaechong345'), 'Revenge', 'small'),
                ((select user_id from Users where username ='jaechong345'), 'Barker', 'large'),
                ((select user_id from Users where username ='jaechong345'), 'Destroyer', 'small')
            `);
        }
        const [reqRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
        if (reqRows[0].count === 0) {
            await db.execute(`
                insert into WalkRequests (dog_id, requested_time, duration_minutes, location, status) values
                ((select dog_id from Dogs where name ='Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
                ((select dog_id from Dogs where name ='Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
                ((select dog_id from Dogs where name ='Revenge'), '2025-06-10 00:00:00', 25, 'Orangutan Grove', 'completed'),
                ((select dog_id from Dogs where name ='Max'), '2025-12-26 20:20:50', 45, 'Sesame Street', 'cancelled'),
                ((select dog_id from Dogs where name ='Destroyer'), '2025-08-30 13:43:03', 60, 'Saks Fifth Avenue', 'open')
            `);
        }
        // ===============================================
    } catch (err) {
        console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
    }
})();

// app.get('/', async (req, res) => {
//   try {
//     const [] = await db.execute('SELECT * FROM ');
//     res.json();
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch ' });
//   }
// });

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;