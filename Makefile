.PHONY: linux
linux:
	docker build -t gobie/tor .
	docker push gobie/tor

.PHONY: armhf
armhf:
	docker build -t gobie/tor:armhf -f Dockerfile_arm32v7 .
	docker push gobie/tor:armhf
