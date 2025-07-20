const dotenv = require("dotenv");
const result = dotenv.config();
if (result.error) {
  console.error("Error loading .env file:", result.error);
  process.exit(1);
}


const express = require("express");  
const mongoose = require("mongoose");
const Car = require("./models/Car");
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.set("view engine", "ejs");


// Debug: Log MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}
console.log("MongoDB URI:", process.env.MONGODB_URI.replace(/:([^:@]+)@/, ":****@"));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error("Error code:", err.code);
    console.error("Error name:", err.name);
    if (err.name === "MongoServerError" && err.code === 8000) {
      console.error("Authentication failed. Check username/password or Atlas user configuration.");
    }
  });

// Routes
// READ: Display all cars
app.get("/carapp", async (req, res) => {
  try {
    const cars = await Car.find();
    console.log("Fetched cars:", cars); // Debug
    res.render("index", { cars });
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).send("Error fetching cars: " + err.message);
  }
});

// CREATE: Add a new car
app.post("/carapp/cars", async (req, res) => {
  try {
    console.log("Form data received:", req.body); // Debug
    const car = await Car.create({
      name: req.body.name,
      description: req.body.description,
      image: req.body.image || "", // Optional field
    });
    

    res.redirect("/carapp");
  } catch (err) {
    console.error("Error saving car:", err);
    res.status(500).send("Error adding car: " + err.message);
  }
});

// UPDATE: Render edit form
app.get("/carapp/cars/:id/edit", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    console.log (car)
    if (!car) {
      return res.status(404).send("Car not found");
    }
    res.render("edit.ejs", { car });
  } catch (err) {
    console.error("Error fetching car for edit:", err);
    res.status(500).send("Error: " + err.message);
  }
});

// DELETE: Delete a car
app.post("/carapp/cars/:id/delete", async (req, res) => {
  try {
    console.log(req.method, req.url);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid car ID" });
    }

    const deletedCar = await Car.findByIdAndDelete(id);
    if (!deletedCar) {
      return res.status(404).json({ error: "Car not found" });
    }

    res.redirect("/carapp");
  } catch (err) {
    console.error("Error deleting car:", err);
    res.status(500).json({ error: "Error deleting car: " + err.message });
  }
});

//Edit Car
app.put("/carapp/cars/:id/editcar", async (req, res) => {
  try {
    console.log("Update data received:", req.body);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid car ID" });
    }

    const car = await Car.findByIdAndUpdate(
      id,
      { name: req.body.name, description: req.body.description, image: req.body.image || "" },
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    console.log("Updated car:", car);
    res.redirect("/carapp");
  } catch (err) {
    console.error("Error updating car:", err);
    res.status(500).json({ error: "Error updating car: " + err.message });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});