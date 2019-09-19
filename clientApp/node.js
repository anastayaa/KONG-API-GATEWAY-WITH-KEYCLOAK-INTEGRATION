'use strict'

const express = require('express')
const app = express()

const path = require('path')
const indexHTML = path.join(__dirname, 'index.html')
const keycloakJSON = path.join(__dirname, 'keycloak.json')

app.get('/', function (req, res) {
  res.sendFile(indexHTML)
})

app.get('/keycloak.json', function (req, res) {
  res.sendFile(keycloakJSON)
})

app.listen(3000)
