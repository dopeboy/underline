import { Header } from 'semantic-ui-react'

const CustomerSupport = (props) => {
    return (
        <>
            <Header as="h2">Customer Support</Header>
            Email{' '}
            <a href="mailto: support@underlinesports.com">
                support@underlinesports.com
            </a>{' '}
            to submit a support request. We will process your request within 48
            hours.
        </>
    )
}

export default CustomerSupport
