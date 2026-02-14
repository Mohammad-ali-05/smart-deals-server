const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());

// Mongodb URI to connect to mongodb
const uri = `mongodb+srv://${process.env.SMART_DB_USER}:${process.env.SMART_DB_PASSWORD}@cluster0.onnu8qm.mongodb.net/?appName=Cluster0`;

// client instance of mongodb client to connect to mongodb
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server
        await client.connect();

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!",
        );

        // Getting Database
        const db = client.db("smartDeals")

        // Getting Collections
        const products = db.collection("products")
        const bids = db.collection("bids")

        /* Products API's */

        /* Bids API's */


    } finally {
      /*   Ensures that the client will close when you finish/error
        await client.close(); */
    }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
    console.log(`Simple server in running on port: ${port}`);
});
