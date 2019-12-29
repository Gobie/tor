.PHONY: amd64
amd64:
	docker build -t gobie/tor:amd64 --build-arg ARCH=node:lts-alpine .
	docker push gobie/tor:amd64

.PHONY: arm32v7
arm32v7:
	docker build -t gobie/tor:arm32v7 --build-arg ARCH=arm32v7/node:lts-alpine .
	docker push gobie/tor:arm32v7

.PHONY: manifest
manifest:
	docker manifest create gobie/tor:latest gobie/tor:amd64 gobie/tor:arm32v7
	docker manifest annotate gobie/tor:latest gobie/tor:amd64 --os=linux --arch=amd64
	docker manifest annotate gobie/tor:latest gobie/tor:arm32v7 --os=linux --arch=arm --variant=v7
	docker manifest push --purge gobie/tor:latest
	docker run --rm mplatform/mquery gobie/tor:latest
