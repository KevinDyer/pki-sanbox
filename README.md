pki-sanbox
===
A test are afor creating and using PKI

## Get docker and setup
``` bash
$ curl https://get.docker.com/ | sh
$ docker network create pki
```

## Get cfssl
``` bash
$ go get -u github.com/cloudflare/cfssl/cmd/...
```

## Create root-ca
``` bash
$ cd root-ca
$ cfssl genkey -initca csr.json | cfssljson -bare root-ca
```

## Create intermediate-ca and start ca service
``` bash
$ cd ../intermediate-ca
$ cfssl genkey -initca csr.json | cfssljson -bare intermediate-ca
$ cfssl sign \
  -ca ../root-ca/root-ca.pem \
  -ca-key ../root-ca/root-ca-key.pem \
  -config config.json intermediate-ca.csr | cfssljson -bare intermediate-ca
$ docker run -d --rm \
  --network pki \
  --name intermediate-ca \
  --hostname intermediate-ca \
  -v ${PWD}:/usr/local/pki \
  cfssl/cfssl serve -address 0.0.0.0 \
    -ca /usr/local/pki/intermediate-ca.pem \
    -ca-key /usr/local/pki/intermediate-ca-key.pem
```

## Create echo service with certificate
``` bash

```
