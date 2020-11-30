#!/bin/bash
set -ev

export BUILDTIMESTAMP=$(date -Iseconds)
export TAG=trubudget/"$PROJECT_NAME":"$GITHUB_BRANCH"

echo "/trubudget/$PROJECT_NAME:t_$GITHUB_RUN_ID"

docker build --build-arg BUILDTIMESTAMP="$BUILDTIMESTAMP" --build-arg CI_COMMIT_SHA="$GITHUB_SHA" --tag "$TAG" -f Dockerfile .

echo "$PRIVATE_REGISTRY_PASSWORD" | docker login -u "$PRIVATE_REGISTRY_USERNAME" --password-stdin "$PRIVATE_REGISTRY"
export TAG_BUILD_PRIVATE="$PRIVATE_REGISTRY_BASE/trubudget/$PROJECT_NAME:t_$GITHUB_RUN_ID"
docker tag "$TAG" "$TAG_BUILD_PRIVATE"
docker push "$TAG_BUILD_PRIVATE" >/dev/null 2>&1

# if [[ "$GITHUB_BRANCH" = "master" ]] && [[ "$GITHUB_EVENT_NAME" = "push" ]];
# then
#   echo "Enter Master Path"
#   # echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
#   # TODO enable docker push to docker hub
#   # docker push "$TAG"
# fi

# TODO check what it does
# if [[ -n "$TRAVIS_TAG" ]];
# then
#   echo "Enter TAG Path"
#   export TAG_LATEST=trubudget/"$PROJECT_NAME":latest
#   echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
#   docker tag "$TAG" "$TAG_LATEST"
#   docker push "$TAG"
#   docker push "$TAG_LATEST"
# fi