# BuffsMarket
Your Trusted Marketplace for CU Boulder Students.  <br /> 

## Vision Statement
For college students, Who attend CU Boulder and buy and sell different items. The Buffs MarketPlace is an online shop that allows students to buy and sell items safely. Unlike eBay or using the Snapchat stories, our product is a marketplace specifically for the students of CU Boulder.

# What is the BuffsMarket?
The BuffsMarketplace is an all inclusive website specifically designed for CU Boulder students. By registering an account with your unique colorado.edu email you are able to view all of the items that oter students are trying to sell or trade for. Each student can create a listing that includes photos of the item, item price, and the seller's message ID. They can also check a specific page called My Listings which include all of the items they are currently selling. After viewing an item on the list the user can click the messaging text in the navbar and input the seller's ID to send them a message/offer. Though are website doesn't include payment methods it connects sellers and buyers.

# Contributors:
Group 3, BuffsMarket  <br /> 

Haeseo Jeong | haejeg | haejeg@gmail.com<br /> 

Jaron Barrett | jaronbarrettCU | jaba6921@colorado.edu<br /> 

Daniel Monteiro | damo8852 | damo8852@colorado.edu <br /> 

Alex Paquier | Alexpaq27 | alpa5529@colorado.edu <br /> 

Ethan Telang | etelangboulder | ette8193@colorado.edu

# Prerequisites to run online
- CU Account
- Online Render Website must be deployed.

# Run online using:
- Online Link: https://buffsmarket.onrender.com/

# Prerequisites to run locally
- CU Account
- Docker

# Run locally using:
- Github Link: https://github.com/haejeg/BuffsMarket
- Open github link and save the code to an editing software.
- Selecting a terminal, cd to ProjectSourceCode
- To start the code using docker, go to terminal and input 'docker compose up --build -d'
- In docker go to the container called 'projectsourcecode' and expand it's contents. One of it's contents should be called 'web-1' and to the right of it is a link called '3000:3000' that opens a local version of the software.
- To end the code using docker, go to terminal and input 'docker compose down -v'

# Technology Stack:
- Docker
- Render

# Built Using:
- Javascript
- HTML
- Handlebars
- Bootstrap
- Node.js
- Sql

# How to run Tests:
- In Section 1: Import Dependencies in index.js, comment out the code labeled RENDER and uncomment the code labeled DOCKER. Then Uncomment the entirety of the server.spec.js file. Finally, run docker-compose up to run the tests in the terminal. 
- To add more tests, you can go to server.spec.js in the test folder and add the specific test.

## Release Notes Dec 2, 2024
- Ability to list item with multiple images
- Chat ability (almost done)
- Logout and username change
- My listings page contains current live listings for specific user
## Release Notes Nov 17, 2024
- Ability to add listing within the website with an associated image.
- Major CSS changes to listings pages and home pages.
## Release Notes Nov 11, 2024
- Ability to register to BuffsMarket with username, email, and password.
- Ability to login with registered email and password.
- Nav bar created with access to homepage and account with a search bar that appears after logging in.
