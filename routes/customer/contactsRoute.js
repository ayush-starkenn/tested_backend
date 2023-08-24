const express = require("express");
const contactsRouter = express.Router();
// imports
const ContactsController = require("../../controllers/customer/contactsController");

//creating the route for the contacts

// 1. getting all the contacts for that particular customer...
contactsRouter.get("/getContacts-all/:user_uuid", ContactsController.getAllContacts);

// 2. getting the specific contact of that customer like 1st contact only....
contactsRouter.get("/getContactById/:contact_uuid", ContactsController.getContact);

// 3. Adding a contact for the customer - using a unique id for that contact as well...
contactsRouter.post("/savecontact/:user_uuid", ContactsController.saveContact);

// 4. Edit the contact added by the customer - personal id of that contact will be used...
// router.put("/editcontact", editContact);
contactsRouter.put("/editcontact/:contact_uuid", ContactsController.editContact);

// 5. Delete the particular contact - using the id of that contact personally...
contactsRouter.put("/deletecontact/:contact_uuid", ContactsController.deleteContact);

//export
module.exports = {contactsRouter}; 