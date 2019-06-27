## What's In This Folder?

The `gql.js` file is provided as an example of how to write an AWS lambda that takes in GET requests and redirects them to the Veritone GraphQL server (via POST).
Results are relayed back to the client just as if the client had contacted the Veritone server directly. 

If you let netlify.com build, deploy, and host your project, lambdas will be deployed automatically to AWS.
In this case, the gql.js lambda can be accessed via https://vtn-integration-demo.netlify.com/.netlify/functions/gql?token=XXX&query=YYY,
where XXX is your Veritone bearer token and YYY is your GraphQL query. A real query might look something like

https://vtn-integration-demo.netlify.com/.netlify/functions/gql?token=53b1c78c-d9da-42ed-bc81-2fe52b838ee6&query=query%20getEngineOutput%20%7B%0A%20%20engineResults(tdoId:%20%22550433699%22,%0A%20%20%20%20engineIds:%20%5B%2260755416-766f-4014-bad9-f0ac8d900b86%22%5D)%20%7B%0A%20%20%20%20records%20%7B%0A%20%20%20%20%20%20tdoId%0A%20%20%20%20%20%20engineId%0A%20%20%20%20%20%20jsondata%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D

(Of course, this example won't actually work because the token is expired!) 

