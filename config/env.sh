#!/bin/bash

# source: https://www.freecodecamp.org/news/how-to-implement-runtime-environment-variables-with-create-react-app-docker-and-nginx-7f9d42a91d70/

echo "Creating env variables script: ./graphkb-env-config.js"
# Recreate config file
ENVJS_FILE=./graphkb-env-config.js
rm -rf $ENVJS_FILE
touch $ENVJS_FILE

# Add assignment
echo "window._env_ = {" >> $ENVJS_FILE

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
  echo "  $varname: '$value'," >> $ENVJS_FILE
done < $ENV_FILE

echo "};" >> $ENVJS_FILE

chmod a+x $ENVJS_FILE
cat $ENVJS_FILE

INDEX_FILE=index.html

# now replace the static file instances of PUBLIC_URL
# adapted from here: https://dev.to/n1ru4l/configure-the-cra-public-url-post-build-with-node-js-and-express-4n8
if [ -f $INDEX_FILE ];
then
  sed -i "s,\%PUBLIC_URL\%,$PUBLIC_URL,g" $INDEX_FILE
fi
