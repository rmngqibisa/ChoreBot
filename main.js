// Define a Chore class to store information about a chore
class Chore {
  constructor(title, description, payment, location) {
    this.title = title;
    this.description = description;
    this.payment = payment;
    this.location = location;
    this.assignedTo = null;
    this.confirmed = false;
  }
  
  assignTo(person) {
    this.assignedTo = person;
  }
  
  confirmPayment() {
    this.confirmed = true;
  }
}

// Define a Person class to store information about a person
class Person {
  constructor(name, address) {
    this.name = name;
    this.address = address;
  }
  
  isWithinRadius(chore) {
    // Implement logic to check if the person's address is within a 10km radius of the chore location
  }
}

// Create an array to store all the available chores
const chores = [];

// Function to add a new chore
function addChore(title, description, payment, location) {
  const chore = new Chore(title, description, payment, location);
  chores.push(chore);
}

// Function to find a chore that is available and within a person's radius
function findMatchingChore(person) {
  for (const chore of chores) {
    if (!chore.assignedTo && chore.confirmed && person.isWithinRadius(chore)) {
      return chore;
    }
  }
  return null;
}
