var deleteButton = document.querySelector('#remove')

console.log("boe")

function sendDelete(event) {
  console.log("/"+this.dataset.id)
  var id = this.dataset.id
  fetch('/' + id, {method: 'delete'})
    .then(onDelete)
}

function onDelete(res) {
  res.json().then(onSucces, onError)
}

function onSucces() {
  console.log("werkt")
  window.location = "/"
}

function onError() {
  throw new Error('Jammurrrr, kan niet verwijderen!')
}

deleteButton.addEventListener('click', sendDelete)
