const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

/* Firebase admin SDk */
const admin = require("firebase-admin");
const serviceAccount = require("./smart-deals-firebase-adminsdk.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

/* Middleware */
app.use(cors());
app.use(express.json());

const verifyFirebaseToken = async (req, res, next) => {
    /* If header is not available send error status and message */
    if (!req.headers.authentication) {
        return res.status(401).send({ message: "Unauthorized access" });
    }
    /* Getting the token */
    const token = req.headers.authentication.split(" ")[1];
    /* If token is not available send error status and message */
    if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
    }

    try {
        const userInfo = await admin.auth().verifyIdToken(token);
        req.tokenEmail = userInfo.email;
        next();
    } catch {
        return res.status(401).send({ message: "Unauthorized access" });
    }

    //
};

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
        const userCollection = db.collection("users");

        /* Users API's */
        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email };
            /* Finding user */
            const ifUserExist = await userCollection.findOne(query);

            /* Checking if user exist */
            if (ifUserExist) {
                res.send({ message: "User already exist" });
            } else {
                /* If user doesn't exist save it to the database */
                const result = await userCollection.insertOne(newUser);
                res.send(result);
            }
        });

        /* Products API's */
        /* All products, search product, and filter products API */
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const result = await cursor.toArray();

            res.send(result);
        });

        /* Latest product API */
        app.get("/latest-products", async (req, res) => {
            const cursor = productsCollection
                .find()
                .sort({ created_at: -1 })
                .limit(6);
            const result = await cursor.toArray();

            res.send(result);
        });

        /* Product details API */
        app.get("/product-details/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.findOne(query);

            res.send(result);
        });

        /* Post a product API */
        app.post("/products", async (req, res) => {
            const productData = req.body;
            const newProduct = {
                ...productData,
                created_at: new Date(productData.created_at),
            };
            const result = await productsCollection.insertOne(newProduct);

            res.send(result);
        });

        /* Update a product API */
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

        /* Delete a product API */
        app.delete("/products/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(query);

            res.send(result);
        });

        /* Bids API's */
        /* Bids per user */
        app.get("/bids", verifyFirebaseToken, async (req, res) => {
            const { userEmail } = req.query;
            const tokenEmail = req.tokenEmail;
            const query = {};

            if (userEmail) {
                if (userEmail !== tokenEmail) {
                    return res
                        .status(403)
                        .send({ message: "Forbidden access" });
                }
                query.buyer_email = userEmail;
            }

            const cursor = bidsCollection.find(query);
            const bids = await cursor.toArray();

            res.send(bids);
        });

        /* Bids by product */
        app.get("/bids/by-product/:productId", verifyFirebaseToken, async (req, res) => {
            const id = req.params.productId;
            const productId = new ObjectId(id);
            const query = {
                product: productId,
            };
            const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
            const result = await cursor.toArray();

            res.send(result);
        });

        /* Posting new bids */
        app.post("/bids", async (req, res) => {
            const bidData = req.body;
            /* Converting product string into object id */
            const product = new ObjectId(bidData.product);
            const bid_price = Number(bidData.bid_price);
            const newBid = { ...bidData, product, bid_price };
            const result = await bidsCollection.insertOne(newBid);

            res.send(result);
        });

        /* Deleting a bid */
        app.delete("/bids/:id", async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await bidsCollection.deleteOne(query);

            res.send(result);
        });
    } finally {
        /*   Ensures that the client will close when you finish/error
        await client.close(); */
    }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
    console.log(`Simple server in running on port: ${port}`);
});
