# KONG-API-GATEWAY-WITH-KEYCLOAK-INTEGRATION
Client-Server node js microservices using Kong API Gateway with integration of keycloak authentication

Getting Started

Clone this repository to your local machine

============== Creationg Node apps containers:

cd serverApp

docker build -t node-server-image .

docker run --name node-server-container -p 3001:3001 -d node-server-image

cd clientApp

docker build -t node-client-image .

docker run --name node-client-container -p 3000:3000 -d node-client-image

================ Create docker network

docker network create neoxia-net

================ Create Cassandra DB

docker run -d --name neoxia-database \
               --network=neoxia-net \
               -p 9042:9042 \
               cassandra:3

================ Configure Cassandra for Kong

docker run --rm \
     --network=neoxia-net \
     -e "KONG_DATABASE=cassandra" \
     -e "KONG_CASSANDRA_KEYSPACE=neoxia" \
     -e "KONG_CASSANDRA_CONTACT_POINTS=neoxia-database" \
     kong:latest kong migrations bootstrap

================ Run Kong Container

docker run -d --name neoxia-container\
     --network=neoxia-net \
     -e "KONG_DATABASE=cassandra" \
     -e "KONG_CASSANDRA_KEYSPACE=neoxia" \
     -e "KONG_CASSANDRA_CONTACT_POINTS=neoxia-database" \
     -e "KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl" \
     -p 8000:8000 \
     -p 8443:8443 \
     -p 8001:8001 \
     -p 8444:8444 \
     kong:latest

================ Run Keycloak Container

docker run \
  -e KEYCLOAK_USER=admin \
  -e KEYCLOAK_PASSWORD=admin \
  --name keycloak \
  -p 8080:8080 \
  jboss/keycloak

--- Adding service to kong:

curl -i -X POST \
  --url http://localhost:8001/services/ \
  --data 'name=neoxia-service-v1' \
  --data 'url=http://@node-server-container:3001/data'
  
--- Ading route to the service:

curl -i -X POST \
  --url http://localhost:8001/services/neoxia-service-v1/routes \
  --data 'paths[]=/data'

--- Adding jwt plugin to the neoxia-service-v1 service

curl -i -X POST --url http://localhost:8001/services/neoxia-service-v1/plugins/ --data 'name=jwt'

--- Adding kong consumer

curl -X POST http://localhost:8001/consumers --data "username=demo-consumer"

CONSUMER_ID=629b99cb-bc22-41a0-bec5-dbe7872db7c5

TOKEN_ISSUER="http://localhost:8080/auth/realms/demo-realm"

RSA_PUB_KEY=`cat mykey-pub.pem`

curl -X POST http://localhost:8001/consumers/$CONSUMER_ID/jwt \
  --data "key=$TOKEN_ISSUER" \
  --data "algorithm=RS256" \
  --data-urlencode "rsa_public_key=$RSA_PUB_KEY"

--- Adding Cors

curl -X POST http://localhost:8001/services/neoxia-service-v1/plugins/ \
  --data "name=cors" \
  --data "config.origins=http://localhost:3000/*" \
  --data "config.methods=GET" \
  --data "config.headers=Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Authorization" \
  --data "config.exposed_headers=Authorization" \
  --data "config.credentials=true" \
  --data "config.max_age=3600"
