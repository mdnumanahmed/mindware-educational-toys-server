const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mindware-educatinal-toy.lnffqes.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toyCollection = client.db('mindwareDB').collection('toys')

    // jwt
    // app.post("/jwt", (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "3d",
    //   });
    //   res.send({ token });
    // });

    // Toy routes
    
    // indexing field
    const indexKeys = {toy_name : 1}
    const indexOptions = {name: 'toyName'}
    const result = await toyCollection.createIndex(indexKeys, indexOptions)
    
    // search api for toys
    app.get('/toys/:text', async(req, res) => {
      const text = req.params.text
      const result = await toyCollection.find({toy_name : {$regex: text, $options:'i'}}).toArray()
      res.send(result)
    })

    app.get('/my-toys/:email', async(req, res) => {
      const query = {seller_email : req.params.email}
      const {sort} = req.query;
      const sortOptions = {}
      if(sort === 'asc'){
        sortOptions.price = 1
      }else if(sort === 'desc'){
        sortOptions.price = -1
      }
      const result = await toyCollection.find(query).sort(sortOptions).toArray()
      res.send(result)
    })

    app.get('/toy/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await toyCollection.findOne(query)
      res.send(result)
    })
    
    app.get("/categorizedToy/:text", async (req, res) => {
      if (
        req.params.text === "Math Toys" ||
        req.params.text === "Language Toys" ||
        req.params.text === "Science Toys"
      ) {
        const result = await toyCollection
          .find({ sub_category : req.params.text })
          .toArray();
        return res.send(result);
      } else {
        const result = await toyCollection.find().toArray();
        res.send(result);
      }
    });

    app.get('/toys', async(req, res) => {
      const toys = await toyCollection.find().limit(20).toArray()
      res.send(toys)
    })


    app.post('/toys', async(req, res) => {
      const data = req.body
      data.createdAt = new Date();
      const result = await toyCollection.insertOne(data)
      res.send(result)
    })

    app.put('/toys/:id', async(req, res) => {
      const id = req.params.id
      const data = req.body;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set : {
          price: data.price,
          available_quantity: data.available_quantity,
          description: data.description,
        }
      }      
      const result = await toyCollection.updateOne(filter, updateDoc)
      res.send(result)
    })


    app.delete('/toys/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await toyCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Mind ware is running");
});

app.listen(port, () => {
  console.log(`Mindware server is running on port: ${port}`);
});
