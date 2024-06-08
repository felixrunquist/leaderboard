.PHONY: build
build:
	docker build -t nextjs-docker .

.PHONY: run
run:
	docker run -p 3000:3000 nextjs-docker
