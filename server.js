// Import necessary modules and initialize Express
const express = require('express');
const fs = require('fs');
const { v4: uniqueId } = require('uuid');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;

// Middleware for handling URL encoding, JSON parsing, and serving static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Create an array to store notes
let noteList = [];

// Route to serve 'notes.html' page
app.get('/notes', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/notes.html'));
});

// Route to read and return notes as JSON
app.get('/api/notes', (req, res) => {
	fs.readFile(path.join(__dirname, '/db/db.json'), 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
		const notesData = JSON.parse(data);
		res.json(notesData);
	});
});

// Save a new note route
app.post('/api/notes', (req, res) => {
	const newNote = req.body;
	newNote.id = uniqueId();

	// Read existing notes, add the new note, and update 'db.json'
	fs.readFile(path.join(__dirname, '/db/db.json'), 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
		const existingNotes = JSON.parse(data);

		existingNotes.push(newNote);

		fs.writeFile(
			path.join(__dirname, '/db/db.json'),
			JSON.stringify(existingNotes),
			(err) => {
				if (err) {
					console.error(err);
					return res.status(500).json({ error: 'Internal Server Error' });
				}
				res.json(newNote);
			}
		);
	});
});

// Delete a note by its ID
app.delete('/api/notes/:id', (req, res) => {
	const noteId = req.params.id;

	// Read existing notes from 'db.json'
	fs.readFile(path.join(__dirname, '/db/db.json'), 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: 'Internal Server Error' });
		}

		const existingNotes = JSON.parse(data);

		// Find the index of the note with the specified ID
		const noteIndex = existingNotes.findIndex((note) => note.id === noteId);

		if (noteIndex !== -1) {
			// Remove the note from the array
			const deletedNote = existingNotes.splice(noteIndex, 1)[0];

			// Update 'db.json' with the modified array
			fs.writeFile(
				path.join(__dirname, '/db/db.json'),
				JSON.stringify(existingNotes),
				(err) => {
					if (err) {
						console.error(err);
						return res.status(500).json({ error: 'Internal Server Error' });
					}

					// Respond with the deleted note
					res.json(deletedNote);
				}
			);
		} else {
			// If the note with the specified ID was not found, return a 404 error
			res.status(404).json({ message: 'Note not found' });
		}
	});
});

// Serve 'index.html' for all other routes
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Start the Express server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
