import { gql, useQuery } from '@apollo/client'
import { isActiveJWT, getJWT } from './utils'
import {
    createHttpLink,
    ApolloProvider,
    ApolloClient,
    InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    Redirect,
} from 'react-router-dom'
import Login from 'views/Login.jsx'
import Signup from 'views/Signup.jsx'
import Lobby from 'views/Lobby.jsx'
import Active from 'views/Active.jsx'
import Completed from 'views/Completed.jsx'
import Settings from 'views/Settings.jsx'
import Creator from 'views/Creator.jsx'
import CreatorPicks from 'views/CreatorPicks.jsx'
import Main from 'components/Main'

// If there isn't a valid token, don't send it. This is because we can have an expired
// token and send it for a page that doesn't need it but it'll error out.
const authLink = setContext((_, { headers }) => {
    if (isActiveJWT()) {
        const token = getJWT()
        return {
            headers: {
                authorization: token ? `JWT ${token}` : '',
            },
        }
    }
})

const httpLink = createHttpLink({
    uri:
        process.env.NODE_ENV === 'production'
            ? '/gql'
            : 'http://localhost:5000/graphql/',
})

/*
const defaultOptions = {
    watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
    },
    query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
    },
}
*/

const defaultOptions = {
    query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
    },
}

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: defaultOptions,
})

const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={(props) =>
            isActiveJWT() ? (
                <Main>
                    <Component {...props} />
                </Main>
            ) : (
                <Redirect to="/login" />
            )
        }
    />
)

const NonLoggedInRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={(props) =>
            isActiveJWT() ? <Redirect to="/lobby" /> : <Component {...props} />
        }
    />
)

function App() {
    return (
        <ApolloProvider client={client}>
            <Router>
                {process.env.NODE_ENV === 'production' && (
                    <Route
                        path="/"
                        render={({ location }) => {
                            if (typeof window.ga === 'function') {
                                window.ga(
                                    'set',
                                    'page',
                                    location.pathname + location.search
                                )
                                window.ga('send', 'pageview')
                            }
                            return null
                        }}
                    />
                )}
                <Switch>
                    <PrivateRoute
                        path="/active"
                        component={Active}
                    ></PrivateRoute>
                    <PrivateRoute
                        path="/completed"
                        component={Completed}
                    ></PrivateRoute>
                    <PrivateRoute
                        path="/settings/:section?"
                        component={Settings}
                    ></PrivateRoute>
                    <NonLoggedInRoute
                        path="/signup"
                        component={Signup}
                    ></NonLoggedInRoute>
                    <NonLoggedInRoute
                        path="/login"
                        component={Login}
                    ></NonLoggedInRoute>
                    <PrivateRoute
                        path="/creator"
                        component={Creator}
                    ></PrivateRoute>
                    <Route
                        path="/lobby"
                        render={(props) => (
                            <Main>
                                <Lobby />
                            </Main>
                        )}
                    />
                    <Route
                        path="/"
                        exact
                        render={(props) => (
                            <Main>
                                <Lobby />
                            </Main>
                        )}
                    />
                    <Route
                        path="/:username"
                        render={(props) => (
                            <Main>
                                <CreatorPicks />
                            </Main>
                        )}
                    />
                </Switch>
            </Router>
        </ApolloProvider>
    )
}

export default App
