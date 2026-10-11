.PHONY: up down demo test logs producer spark

up:            ## Start the full Big Data stack
	docker compose up --build

down:          ## Stop and remove containers
	docker compose down -v

demo:          ## Run the one-command guided demo
	./scripts/demo.sh

test:          ## Run backend + streaming tests
	cd backend && pytest -q
	cd streaming && pytest -q

logs:          ## Tail all service logs
	docker compose logs -f

producer:      ## Start only the event producer
	docker compose up producer

spark:         ## Start only the Spark streaming job
	docker compose up spark
