import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import connectDB from "./src/db/db.js";
import { config as dotenvConfig } from "dotenv";
import { sendEmail } from "./src/utility/sendEmail.js";
import { upload } from "./src/middleware/multerMiddleware.js";
import { uploadToCloudinary } from "./src/utility/cloudinary.js";

dotenvConfig();

const app = express();

const port = process.env.PORT || 8080;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//routes
app.use("/api/auth", authRoutes);

//temporary routes
/*
 * Route to check if the mail is up and running.
 * Route to send an email.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.email - The email to send to.
 * @param {string} req.body.subject - The subject of the email.
 * @param {string} req.body.text - The text content of the email.
 * @param {string} req.body.html - The html content of the email.
 * @param {Object} res - The response object.
 * @return {string} The response indicating whether the email was sent successfully or not.
 */
app.post("/send-email", async (req, res) => {
	try {
		const { email, subject, text, html } = req.body;
		await sendEmail(email, subject, text, html);
		res.status(200).send("Email sent successfully");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error sending email");
	}
});

// Route to upload a file to cloudinary.
//
// @param {Object} req - The request object.
// @param {Object} req.file - The uploaded file.
// @param {string} req.file.path - The path of the uploaded file.
// @param {Object} res - The response object.
// @return {string} The URL of the uploaded file.
app.post("/upload", upload.single("avatar"), async (req, res) => {
	console.log(req.file);
	// Extract the path of the uploaded file.
	const avatarLocalPath = req.file?.path;

	// If the file is not found, throw an error.
	if (!avatarLocalPath) {
		throw new Error("File not found");
	}
	try {
		// Upload the file to cloudinary and get the URL.
		const url = await uploadToCloudinary(avatarLocalPath);
		// Send the URL as the response.
		res.status(200).send(url);
	} catch (error) {
		// Log the error and send a 500 status code.
		console.error(error);
		res.status(500).send("Error uploading file");
	}
});

//error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

//connect to database
connectDB()
	.then(() => {
		app.listen(port, () => {
			console.log(`⚙️  Server is running on port:  ${port}`);
		});
	})
	.catch((err) => {
		console.error("Unable to connect to database:", err.message);
		process.exit(1);
	});
