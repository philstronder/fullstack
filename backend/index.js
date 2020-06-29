require('dotenv-safe').config()
var jwt = require('jsonwebtoken')
var http = require('http'); 
const express = require('express') 
const app = express() 
var cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const db = require('./config/db')
const bcrypt = require('bcrypt-nodejs')


 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(cookieParser()); 
 
app.get('/', (req, res, next) => {
    res.json({message: "Tudo ok por aqui!"});
})

//delete by ID
app.delete('/users/:id', verifyJWT, async function (req, res, next)  {
    const id = req.params.id

    try {
        await db('users_profiles')
            .where({user_id: id})
            .delete()
    
        await db('users')
            .where({id})
            .delete()

    } catch (e) {
        console.log(e)
    }
    
})

//get by ID
app.get('/users/:id', verifyJWT, (req, res, next) => {
    
    db('users')
        .where({id: req.params.id})
        .then(user => res.json(
            user
        ))
})

//get all users
app.get('/users', verifyJWT, (req, res, next) => {
    
    db('users')
        .then(user => res.json(
            user
        ))
})

//update user
app.put('/user', verifyJWT, (req, res, next) => {

})

//insert user
app.post('/user', async (req, res, next) => {
    const data = req.body

    try{
        //get profiles ids
        const profile = await db('profiles')
                .where({name: 'common'})
                .first()
        profileIds = []
        profileIds.push(profile.id)

        //password encryption
        const salt = bcrypt.genSaltSync()
        data.password = bcrypt.hashSync(data.password, salt)
        
        delete data.profiles

        //insert in users table
        const [id] = await db('users')
                        .insert(data)
        
        //insert in users_profiles table
        for(let profile_id of profileIds) {
            await db('users_profiles')
                .insert({profile_id, user_id: id})
        }
        
        const addedUser = await db('users')
            .where({id}).first()
            
        return res.json(addedUser)

    } catch(e) {
        throw new Error(e.sqlMessage)
    }
})
 
app.get('/clientes', verifyJWT, (req, res, next) => { 
    console.log("Retornou todos clientes!");
    res.json([{id:1,nome:'luiz'}]);
}) 

app.post('/login', (req, res, next) => {
    //esse teste abaixo deve ser feito no seu banco de dados
    if(req.body.user === 'luiz' && req.body.pwd === '123'){
      //auth ok
      const id = 1; //esse id viria do banco de dados
      var token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: 300 // expires in 5min
      });
      return res.json({ auth: true, token: token });
    }
    
    res.status(500).json({message: 'Login inválido!'});
})

app.post('/logout', function(req, res) {
    res.json({ auth: false, token: null });
})

function verifyJWT(req, res, next){
    //const auth = req.headers.authorization
    //const token = auth && auth.substring(7) //not considering the 'Bearer' word

    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      
      // se tudo estiver ok, salva no request para uso posterior
      req.userId = decoded.id;
      next();
    });
}
 
var server = http.createServer(app); 
server.listen(3000);
console.log("Servidor escutando na porta 3000...")