import { gql, useQuery } from '@apollo/client'
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
import { useHistory } from 'react-router-dom'
import styles from './Main.module.css'

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
        }
    }
`

const Main = (props) => {
    const { data } = useQuery(GET_ME_QUERY)
    const logoutUser = () => {
        clearJWT()
        history.push('/')
    }
    const history = useHistory()

    return (
        <>
            <Menu size="massive" className={styles['ule-navbar']}>
                <Menu.Item>
                    <img src={logo} id={styles.logo} />
                </Menu.Item>

                <Menu.Item active>Pick'Em</Menu.Item>

                <Menu.Menu position="right">
                    <Dropdown
                        item
                        text={
                            data &&
                            `${data.me.firstName} ${data.me.lastName[0]}.`
                        }
                    >
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={logoutUser}>
                                Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            </Menu>
            <div className={styles['ule-container']}>{props.children}</div>
        </>
    )
}

export default Main
