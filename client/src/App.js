import { gql, useQuery } from '@apollo/client'
import { getJWT } from './utils'
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
import Main from 'components/Main'

const authLink = setContext((_, { headers }) => {
    const token = getJWT()
    return {
        headers: {
            authorization: token ? `JWT ${token}` : '',
        },
    }
})

const httpLink = createHttpLink({
    uri:
        process.env.NODE_ENV === 'production'
            ? '/gql'
            : 'http://localhost:5000/graphql/',
})

const defaultOptions: DefaultOptions = {
    watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
    },
    query: {
        fetchPolicy: 'no-cache',
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
            getJWT() ? (
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
            getJWT() ? <Redirect to="/lobby" /> : <Component {...props} />
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
                        path="/lobby"
                        component={Lobby}
                    ></PrivateRoute>
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
                        path="/"
                        component={Login}
                    ></NonLoggedInRoute>
                </Switch>
            </Router>
        </ApolloProvider>
    )
}

export default App
