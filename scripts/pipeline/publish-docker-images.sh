#!/bin/bash
set -ev

echo "$PRIVATE_REGISTRY_PASSWORD"
echo "$PRIVATE_REGISTRY_USERNAME"
echo "$PRIVATE_REGISTRY"
echo "$PROJECT_NAME"
echo "$GITHUB_BRANCH"
echo "$GITHUB_RUN_ID"
echo "$GITHUB_EVENT_NAME"

export BUILDTIMESTAMP=$(date -Iseconds)
export TAG=trubudget/"$PROJECT_NAME":"$GITHUB_BRANCH"

docker build --build-arg BUILDTIMESTAMP="$BUILDTIMESTAMP" --build-arg CI_COMMIT_SHA="$GITHUB_SHA" --tag "$TAG" -f Dockerfile .

if [[ "$GITHUB_EVENT_NAME" = "pull_request" ]];
then
  echo "$PRIVATE_REGISTRY_PASSWORD" | docker login -u "$PRIVATE_REGISTRY_USERNAME" --password-stdin "$PRIVATE_REGISTRY"
  export TAG_BUILD_PRIVATE="$PRIVATE_REGISTRY_BASE/trubudget/$PROJECT_NAME:t_$GITHUB_RUN_ID"
  docker tag "$TAG" "$TAG_BUILD_PRIVATE"
  echo "Pushing [private]/trubudget/$PROJECT_NAME:$GITHUB_RUN_ID"
  docker push "$TAG_BUILD_PRIVATE" >/dev/null 2>&1
fi

if [[ "$GITHUB_BRANCH" = "master" ]] && [[ "$GITHUB_EVENT_NAME" = "push" ]];
then
  echo "Enter Master Path"
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  # TODO enable docker push to docker hub
  # docker push "$TAG"
fi

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