
### Example deploy command
```
helm --namespace use-of-force-dev  --tiller-namespace use-of-force-dev upgrade use-of-force ./use-of-force/ --install --values=values-dev.yaml --values=example-secrets.yaml
```

### Rolling back a release
Find the revision number for the deployment you want to roll back:
```
helm --tiller-namespace use-of-force-dev history use-of-force -o yaml
```
(note, each revision has a description which has the app version and circleci build URL)

Rollback
```
helm --tiller-namespace use-of-force-dev rollback use-of-force [INSERT REVISION NUMBER HERE] --wait
```

### Helm init

```
helm init --tiller-namespace use-of-force-dev --service-account tiller --history-max 200
```

### Setup Lets Encrypt cert

```
kubectl -n use-of-force-dev apply -f certificate-dev.yaml
kubectl -n use-of-force-preprod apply -f certificate-preprod.yaml
kubectl -n use-of-force-prod apply -f certificate-prod.yaml
```
