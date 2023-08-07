import React, { useCallback, useState } from "react";
import { useHistory } from "react-router";
import { magic } from "../magic";
import google from "../google.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const history = useHistory();

  /**
   * Perform login action via Magic's passwordless flow. Upon successuful
   * completion of the login flow, a user is redirected to the homepage.
   */
  const loginWithEmail = useCallback(async () => {
    setIsLoggingIn(true);

    try {
      await magic.auth.loginWithEmailOTP({ email });
      history.push("/");
    } catch (err) {
      console.log(err);
      setIsLoggingIn(false);
    }
  }, [email]);

  const loginWithSMS = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      await magic.auth.loginWithSMS({ phoneNumber });
      history.push("/");
    } catch (err) {
      console.log(err);
      setIsLoggingIn(false);
    }
  }, [phoneNumber, history]);

  const handleLoginWithGoogle = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    await magic.oauth.loginWithRedirect({
      provider: "google",
      redirectURI: `${window.location.origin}/callback`
    });
  };

  /**
   * Saves the value of our email input into component state.
   */
   const handleEmailInputOnChange = useCallback((event) => {
    setEmail(event.target.value);
  }, []);

  const handleSmsInputOnChange = useCallback((event) => {
    setPhoneNumber(event.target.value);
  }, []);

  return (
    <div className="container">
      <h1>Please sign up or login</h1>
      <input
        type="email"
        name="email"
        required="required"
        placeholder="Enter your email"
        onChange={handleEmailInputOnChange}
        disabled={isLoggingIn}
      />
      <button onClick={loginWithEmail} disabled={isLoggingIn}>Send</button>
      <div>or</div><br />
      <img
        src={google}
        height={50}
        alt="login with google"
        onClick={handleLoginWithGoogle}
        disabled={isLoggingIn}
      />
      <input
        type="tel"
        name="phone"
        required="required"
        placeholder="+12345678901"
        onChange={handleSmsInputOnChange}
        disabled={isLoggingIn}
      />
      <button onClick={loginWithSMS} disabled={isLoggingIn}>
        Send
      </button>
    </div>
  );
}

