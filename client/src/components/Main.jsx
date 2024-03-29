import { gql, useQuery } from '@apollo/client'
import React, { useState } from 'react'
import {
    Divider,
    Form,
    Progress,
    Segment,
    Grid,
    Icon,
    Card,
    Image,
    Header,
    Input,
    Container,
    Button,
    Dropdown,
    Menu,
} from 'semantic-ui-react'
import logo from 'images/logo.png'
import logoMobile from 'images/logo_m.png'
import { isActiveJWT, clearJWT } from 'utils'
import { useParams, Link, useLocation, useHistory } from 'react-router-dom'
import './Main.scss'

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
            username
            walletBalance
            creator
        }
    }
`

const Main = (props) => {
    const { data, refetch } = useQuery(GET_ME_QUERY)

    const logoutUser = () => {
        clearJWT()
        history.push('/')
    }
    const history = useHistory()
    const location = useLocation()
    const { code } = useParams()

    return (
        <>
            <Grid id="ule-navbar">
                <Grid.Row only="mobile">
                    <Menu className="mobile">
                        <Menu.Item>
                            <Link to="/lobby">
                                <img src={logoMobile} className="logo" />
                            </Link>
                        </Menu.Item>

                        <Menu.Menu position="right">
                            {!isActiveJWT() && (
                                <Menu.Item position="right">
                                    <Button
                                        as={Link}
                                        to={`/signup${
                                            code ? '?code=' + code : ''
                                        }`}
                                        className="deposit-btn"
                                    >
                                        Sign Up
                                    </Button>
                                </Menu.Item>
                            )}
                            {isActiveJWT() && (
                                <Menu.Item position="right">
                                    Balance:&nbsp;&nbsp;$
                                    {data && Math.round(data.me.walletBalance)}
                                </Menu.Item>
                            )}
                            {isActiveJWT() && data && (
                                <Dropdown
                                    item
                                    text={
                                        isActiveJWT()
                                            ? data &&
                                              `${data.me.firstName} ${data.me.lastName[0]}.`
                                            : ''
                                    }
                                >
                                    <Dropdown.Menu>
                                        <Dropdown.Item as={Link} to="/lobby">
                                            Lobby
                                        </Dropdown.Item>
                                        <Dropdown.Item as={Link} to="/active">
                                            Active
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            as={Link}
                                            to="/completed"
                                        >
                                            Complete
                                        </Dropdown.Item>
                                        {isActiveJWT() &&
                                            data &&
                                            data.me.creator && (
                                                <Dropdown.Item
                                                    as={Link}
                                                    to="/creator"
                                                >
                                                    Creator
                                                </Dropdown.Item>
                                            )}
                                        <Dropdown.Item
                                            as={Link}
                                            to="/settings/deposit"
                                        >
                                            Deposit
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            as={Link}
                                            to="/settings/account"
                                        >
                                            Settings
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={logoutUser}>
                                            Logout
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </Menu.Menu>
                    </Menu>
                </Grid.Row>
                <Grid.Row only="computer">
                    <Menu size="massive" className="desktop">
                        <Menu.Item>
                            <Link to="/lobby">
                                <img src={logo} className="logo" />
                            </Link>
                        </Menu.Item>

                        <Menu.Item
                            active={
                                location.pathname === '/' ||
                                location.pathname.startsWith('/lobby')
                            }
                            as={Link}
                            to="/lobby"
                        >
                            Lobby
                        </Menu.Item>
                        {isActiveJWT() && (
                            <Menu.Item
                                active={location.pathname === '/active'}
                                as={Link}
                                to="/active"
                            >
                                Active
                            </Menu.Item>
                        )}
                        {isActiveJWT() && (
                            <Menu.Item
                                active={location.pathname === '/completed'}
                                as={Link}
                                to="/completed"
                            >
                                Completed
                            </Menu.Item>
                        )}
                        {isActiveJWT() && data && data.me.creator && (
                            <Menu.Item
                                active={location.pathname === '/creator'}
                                as={Link}
                                to="/creator"
                            >
                                Creator
                            </Menu.Item>
                        )}

                        <Menu.Menu position="right">
                            {isActiveJWT() && (
                                <Menu.Item position="right">
                                    Balance:&nbsp;&nbsp;$
                                    {data && Math.round(data.me.walletBalance)}
                                </Menu.Item>
                            )}
                            {isActiveJWT() && (
                                <Menu.Item position="right">
                                    <Button
                                        as={Link}
                                        to="/settings/deposit"
                                        className="deposit-btn"
                                    >
                                        Deposit
                                    </Button>
                                </Menu.Item>
                            )}

                            {!isActiveJWT() && (
                                <Menu.Item position="right">
                                    <Button
                                        as={Link}
                                        to={`/signup${
                                            code ? '?code=' + code : ''
                                        }`}
                                        className="deposit-btn"
                                    >
                                        Sign Up
                                    </Button>
                                </Menu.Item>
                            )}

                            {isActiveJWT() && (
                                <Dropdown
                                    item
                                    text={
                                        isActiveJWT() &&
                                        data &&
                                        `${data.me.firstName} ${data.me.lastName[0]}.`
                                    }
                                >
                                    <Dropdown.Menu>
                                        <Dropdown.Item
                                            as={Link}
                                            to="/settings/account"
                                        >
                                            Settings
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={logoutUser}>
                                            Logout
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </Menu.Menu>
                    </Menu>
                </Grid.Row>
            </Grid>
            <div className="ule-container">
                {React.cloneElement(props.children, {
                    updateMainComponent: refetch,
                })}
            </div>
        </>
    )
}

export default Main
