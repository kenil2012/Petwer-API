require('dotenv').config();
const express = require('express')
const cors = require('cors');
const app = express()

app.use(cors({
    origin: '*'
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./models');

db.mongoose
  .connect(`mongodb://127.0.0.1:27017/petwer`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// routes
require("./routes/auth")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
