#!/bin/bash

# source: https://www.freecodecamp.org/news/how-to-implement-runtime-environment-variables-with-create-react-app-docker-and-nginx-7f9d42a91d70/

echo "Creating env variables script: ./graphkb-env-config.js"
# Recreate config file
rm -rf ./graphkb-env-config.js
touch ./graphkb-env-config.js

# Add assignment
echo "window._env_ = {" >> ./graphkb-env-config.js

ENV_FILE=.env

if [ ! -f "$ENV_FILE" ];
then
  ENV_FILE=config/.env
fi

# Read each line in .env file
# Each line represents key=value pairs
while read -r line || [[ -n "$line" ]];
do
  # Split env variables by character `=`
  if printf '%s\n' "$line" | grep -q -e '='; then
    varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
    varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
  fi
  # Read value of current variable if exists as Environment variable
  value=$(printf '%s\n' "${!varname}")
  # Otherwise use value from .env file
  if [[ -z $value ]]
  then
    value=${varvalue}
    echo "$varname=$varvalue (DEFAULT)"
  else
    echo "$varname=$value (CUSTOM)"
  fi
  # Append configuration property to JS file
  echo "  $varname: \"$value\"," >> ./graphkb-env-config.js
done < $ENV_FILE

echo "}" >> ./graphkb-env-config.js

cat ./graphkb-env-config.js
