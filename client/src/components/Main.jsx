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
import { clearJWT } from 'utils'
import { Link, useLocation, useHistory } from 'react-router-dom'
import './Main.scss'

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
            walletBalance
        }
    }
`

const Main = (props) => {
    const { data, refetch } = useQuery(GET_ME_QUERY)
    const [updateComponent, setUpdateComponent] = useState(false)

    const logoutUser = () => {
        clearJWT()
        history.push('/')
    }
    const history = useHistory()
    const location = useLocation()

    const updateMe = () => setUpdateComponent(!updateComponent)

    return (
        <>
            <Menu size="massive" id="ule-navbar">
                <Menu.Item>
                    <Link to="/lobby">
                        <img src={logo} className="logo" />
                    </Link>
                </Menu.Item>

                <Menu.Item
                    active={location.pathname === '/lobby'}
                    as={Link}
                    to="/lobby"
                >
                    Lobby
                </Menu.Item>
                <Menu.Item
                    active={location.pathname === '/active'}
                    as={Link}
                    to="/active"
                >
                    Active
                </Menu.Item>
                <Menu.Item
                    active={location.pathname === '/completed'}
                    as={Link}
                    to="/completed"
                >
                    Completed
                </Menu.Item>

                <Menu.Menu position="right">
                    <Menu.Item position="right">
                        Balance:&nbsp;&nbsp;$
                        {data && Math.round(data.me.walletBalance)}
                    </Menu.Item>
                    <Menu.Item position="right">
                        <Button
                            as={Link}
                            to="/settings/deposit"
                            className="deposit-btn"
                        >
                            Deposit
                        </Button>
                    </Menu.Item>

                    <Dropdown
                        item
                        text={
                            data &&
                            `${data.me.firstName} ${data.me.lastName[0]}.`
                        }
                    >
                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to="/settings/account">
                                Settings
                            </Dropdown.Item>
                            <Dropdown.Item onClick={logoutUser}>
                                Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            </Menu>
            <div className="ule-container">
                {React.cloneElement(props.children, {
                    updateMainComponent: refetch,
                })}
            </div>
        </>
    )
}

export default Main
