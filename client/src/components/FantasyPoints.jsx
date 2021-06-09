import { Header } from 'semantic-ui-react'
const FantasyPoints = (props) => {
    return (
        <>
            <Header as="h2">Fantasy points</Header>
            <p>Fantasy points are calculated in the following way:</p>
            <ul>
                <li>Point: 1pts</li>
                <li>Rebound: 1.2pts</li>
                <li>Assist: 1.5pts</li>
                <li>Block: 2pts</li>
                <li>Steal: 2pts</li>
                <li>Turnover: -1pts</li>
            </ul>
        </>
    )
}

export default FantasyPoints
