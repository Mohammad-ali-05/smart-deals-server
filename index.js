const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        const db = client.db("smartDeals");

        // Getting Collections
        const productsCollection = db.collection("products");
        const bidsCollection = db.collection("bids");

        /* Products API's */
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const result = await cursor.toArray();

            res.send(result);
        });

        app.get("/products/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.findOne(query);

            res.send(result);
        });

        app.post("/products", async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);

            res.send(result);
        });

        app.patch("/products/:id", async (req, res) => {
            const { id } = req.params;
            const updatedProducts = req.body;
            const query = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    name: updatedProducts.name,
                    price: updatedProducts.price,
                },
            };
            const result = await productsCollection.updateOne(query, update);

            res.send(result);
        });

        app.delete("/products/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(query);

            res.send(result);
        });

        /* Bids API's */
        app.get("/bids", async (req, res) => {
            const cursor = bidsCollection.find({})
            const bids = await cursor.toArray()

            res.send(bids)
        })

        app.post("/bids", async (req, res) => {
            const newBid = req.body
            const result = await bidsCollection.insertOne(newBid)

            res.send(result)
        })

        app.delete("/bids/:id", async (req, res) => {
            const { id } = req.params
            const query = {_id: new ObjectId(id)}
            const result = await bidsCollection.deleteOne(query)

            res.send(result)
        })


    } finally {
        /*   Ensures that the client will close when you finish/error
        await client.close(); */
    }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
    console.log(`Simple server in running on port: ${port}`);
});
