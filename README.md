# be-assessment-2
Final assesment backend

_Table of content_
- [MAYBEE](#maybee)
- [Installation](#installation)
- [To-Do](#to-do)


## MAYBEE

MAYBEE is a dating platform where everyone should feel accepted (homo, bi, trans, gender neutral etc.).
Users need to **create** an account or **log in** to use the website. They are able to **edit** and **delete** their account, **find matches** depending on their given preferences and ofcourse **edit their preferences** at all times.

## Installation

**Follow the following steps to install this project and run it.**

Open your terminal
First `cd` to the folder you want to install the files in

Run the command to clone this project
```bash
clone https://github.com/maybuzz/be-assesment-2.git
cd be-assesment-2
npm install
```
The database used for this project is [MongoDB](https://www.mongodb.com/) 

**Follow these steps to install it**

First make sure you install [Homebrew](https://brew.sh/index_nl), visit their page to install

Open your terminal
```bash
brew install mongodb
brew services start mongodb

```
Now you installed and started your Mongo database

Open another tab in your terminal and run this code to make a new directory in the project folder, use bash to do so
```bash
mkdir db
mongod --dbpath db
```

Go back to the first tab in your terminal, open the [mongo shell](https://docs.mongodb.com/getting-started/shell/client/) to create your databse and the collections you need to store your data. For this project (MAYBEE) you need one collection called 'users' to store all the users
```bash
mongo
use MAYBEE
db.runCommand( { create: "users" } )
```

Now we have a database called `MAYBEE` with a collection named `users`

Open your terminal and `cd` to your project folder and create a .env file to store your secret database info
```bash
touch .env
echo "
DB_HOST=localhost
DB_PORT=27017
DB_NAME=MAYBEE
" >> .env
```
When all this is done you need to `cd` back into the project folder and run the following code to run your website
```bash
npm start
```

The website you just created runs on `localhost:3333`

### To-do
- [x] Create a mongo database
- [x] Add a .env
- [x] Create forms & pages
- [x] Change .html to .ejs
- [x] Delete profile
- [x] Edit profile
- [x] Look for matches by preferences
- [ ] Multer
- [ ] Hash password
- [ ] Final touchups (css, js, micro-interactions etc.)
