import logo from './logo.svg';
import './App.css';
import { gql, useQuery } from '@apollo/client';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import Login from './views/Login.jsx'
import Dashboard from './views/Dashboard.jsx'


const GET_QUERY = gql` 
    { yay }
`;

const client = new ApolloClient({
    uri:
    process.env.NODE_ENV === "production"
    ? "/gql"
    : "http://localhost:5000/graphql/",
    cache: new InMemoryCache()
});

function Sample() {
  const { loading, error, data } = useQuery(GET_QUERY);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
      <div>{data.yay}</div>
  );
}

function App() {
  return (
  <ApolloProvider client={client}>
      <Router>
      <Switch>
          <Route path="/dashboard">
            <Dashboard/>
          </Route>
          <Route path="/">
            <Login/>
          </Route>
      </Switch>
      </Router>
 </ApolloProvider>
  );
}

export default App;
