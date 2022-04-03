import { useContext } from 'react'
import { Link } from "react-router-dom"
import { Ctx } from './context.jsx'

const Navbar = (params) => {
  const { identificationNumber, setIdentificationNumber } = useContext(Ctx)
  return (
    <nav className="uk-navbar-container" uk-navbar="true">
      <div className="uk-navbar-left">
        <ul className="uk-navbar-nav">
          <li>
            <Link to="/" >
              home
            </Link>
          </li>
          <li>
            <div className="uk-navbar-item">
              <form className="uk-search uk-search-navbar">
                <span uk-search-icon="true"></span>
                <input className="uk-search-input" type="search" placeholder="Search"
                  value={identificationNumber} onChange={e => {
                    //TODO: premendo enter riavvia tutto senza motivo
                    //TODO: può capitare che vada fuori sync quando vengono cancellati i valori (ctrl+a, return)
                    setIdentificationNumber(e.target.value)
                  }}></input>
              </form>
            </div>
          </li>
        </ul>
      </div>
      <div className="uk-navbar-center"></div>
      <div className="uk-navbar-right">
        <ul className="uk-navbar-nav">
          <li>
            <Link to="/exams" >exams</Link>
          </li>
          <li>
            <LoginIcon />
          </li>
        </ul>
      </div>
    </nav>
  )
}

const LoginIcon = () => {
  const { token, setToken } = useContext(Ctx)
  if (token) {
    return (
      <Link className="uk-navbar-nav" to="/" onClick={() => { setToken("") }} >
        logout
      </Link>
    )
  } else {
    return (
      <Link className="uk-navbar-item uk-logo" to="/login" >
        <span uk-icon="sign-in"></span>
      </Link>
    )
  }
}

export default Navbar;
