const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chain';
const db = level(chainDB, {valueEncoding: 'json'});


/* ===== Level DB Functions =======================
|  Functions to operate on a LevelDB  			   |
|  ===============================================*/

// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
};

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this._dbexists = false // 
    this.addBlock(new Block("First block in the chain - Genesis block"));
  }

  async getBlockHeight(){
    // Returns the height of the chain
    let h = await new Promise(function(resolve){
      let i = 0;
      db.createReadStream().on('data', function(data) {
        i++;
      }).on('error', function(err) {
          return console.log('Unable to read data stream!', err)
      }).on('close', function() {
        resolve(i)
      })
    })    
    return h
  }

  async getBlock(blockHeight){
    // Returns the block of particular height
    let blk = await new Promise(function(resolve){
      db.get(blockHeight)
        .then((value) => resolve(value))
    })
    return blk
  }

  async addBlock(newBlock){
    // Add a block
    // If it is the genesis block it checks if blockchain exists otherwise it is not added
    let h = await this.getBlockHeight()
    if (h === 0){
      console.log("Adds genesis")
      // Update the block
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      await db.put(0, newBlock)
      this._dbexists  = true
    }
    else{
      if (this._dbexists){
        // add the block at the end
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        newBlock.height = h
        await db.get(h-1)
          .then((value) => newBlock.previousBlockHash = value.hash)
          .then(function(){
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()
            db.put(h, newBlock)
          })
      }
      else{
        console.log("Blockchain exists")
        this._dbexists  = true
      }
    }
  }

  async validateBlock(blockHeight){
    // Validates a particular block 
    return await new Promise(function(resolve){
      // read the block from the db
      db.get(blockHeight)
        .then(function(block){
          let valid = false
          let blockHash = block.hash;
          // remove block hash to test block integrity
          block.hash = '';
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          if (blockHash===validBlockHash) {
            valid = true
          } 
          else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            valid = false
          }
          resolve(valid)
      })
    })
  }

  async validateChain(){
    // Validates the whole chain
    let errorLog = []
    let h = await this.getBlockHeight()
    let block = await this.getBlock(0);
    let blockHash = block.hash 

    for (var i = 0; i < h ; i++){
      if (!await this.validateBlock(i))errorLog.push(i)
      // compare blocks hash link
      if (i > 0){
        let block = await this.getBlock(i);
        let previousHash = block.previousBlockHash
        if (blockHash!==previousHash) {
          errorLog.push(i);
        }
        blockHash = block.hash  
      }
    }
    if (errorLog.length>0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: '+errorLog);
    } else {
      console.log('No errors detected');
    }
  }
}

let blockchain = new Blockchain();


/* ===== REst Functions =======================
|  Functions to operate on a LevelDB  			   |
|  ===============================================*/

const express = require('express')
const app = express()
app.use(express.json())
const PORT  = 8000;


app.get('/', (req, res) => res.send('Welcome to my blockchain!'))

app.get('/block/:id', (req, res) => {
  let blockHeight = Number(req.params.id)
  blockchain.getBlock(blockHeight).then(function(block){
  console.log(block)
  res.send(block)
  })
  // Add error handler
})

app.post('/block', (req,res) => {
  console.log("POST on port 8000")
  console.log(typeof(req.body["body"]))
  blockchain.addBlock(new Block(req.body["body"])).then(console.log('Added new block'))

})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}`))