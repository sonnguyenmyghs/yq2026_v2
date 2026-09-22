//default flag
var _flag_hotel = $('.flag-hotel-checkout').val();
var _arr_flag = ['SG'];
var _flag_default = 'auto';
 if(jQuery.inArray(_flag_hotel, _arr_flag) !== -1) {
    _flag_default = _flag_hotel;
 }
 else {
    _flag_default = 'auto';
 }
// new tel input register
var input_register = document.querySelector("#phone_register");
var result_register = document.querySelector("#result_register")

// here, the index maps to the error code returned from getValidationError - see readme
const errorMap = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];

// initialise plugin
const iti = window.intlTelInput(input_register, {
    initialCountry: _flag_default,
    geoIpLookup: (success, failure) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => success(data.country_code))
          .catch(() => failure());
    },
    hiddenInput: () => ({ phone: "redeem_detail[phone]" }),
    loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.0/build/js/utils.js"),
});

const reset = () => {

  result_register.style.color = '';
  result_register.textContent = "";
  input_register.classList.remove("error");
};

const showError = (msg) => {

  result_register.style.color = 'red';
  result_register.textContent = "Invalid phone number";
  input_register.classList.add('error');
};

// on click button: validate
input_register.addEventListener('keyup', () => {

  reset();
  if (!input_register.value.trim()) {
    showError("Required");
  } else if (iti.isValidNumber()) {
    //validMsg.classList.remove("hide");
    const number = iti.getNumber(intlTelInput.utils.numberFormat.E164);
    const hiddenInput = document.querySelector('input[type="hidden"][name="redeem_detail[phone]"]');
    hiddenInput.value = number;
    result_register.style.color = 'green';
    result_register.textContent = "Valid phone number";
    input_register.classList.remove("error");
  } else {
    const errorCode = iti.getValidationError();
    const msg = errorMap[errorCode] || "Invalid number";
    showError(msg);
  }
});

// ------


//member login

// new tel input register
var input_member = document.querySelector("#phone_member");
var result_member = document.querySelector("#result_member")

// here, the index maps to the error code returned from getValidationError - see readme

// initialise plugin
const iti__member = window.intlTelInput(input_member, {
  initialCountry: _flag_default,
  geoIpLookup: (success, failure) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => success(data.country_code))
          .catch(() => failure());
    },
  hiddenInput: () => ({ phone: "member[phone]" }),
  loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.0/build/js/utils.js"),
});
if (input_member.value != "" || input_member.value.length <= 6 ) {
  console.log(">>>>> have member phone number ",input_member.value);
  document.querySelector('input[type="hidden"][name="member[phone]"]').value = "+"+input_member.value;
}
const reset__member = () => {

  result_member.style.color = '';
  result_member.textContent = "";
  input_member.classList.remove("error");
};

const showError__member = (msg) => {

  result_member.style.color = 'red';
  result_member.textContent = "Invalid phone number";
  input_member.classList.add('error');
};

// on click button: validate
input_member.addEventListener('keyup', () => {
  reset__member();
  if (!input_member.value.trim()) {
    showError__member("Required");
  } else if (iti__member.isValidNumber()) {
    //validMsg.classList.remove("hide");
    const number_member = iti__member.getNumber(intlTelInput.utils.numberFormat.E164);
    const hiddenInputMember = document.querySelector('input[type="hidden"][name="member[phone]"]');
    hiddenInputMember.value = number_member;
    console.log("----------------------->number_member ", number_member)
    result_member.style.color = 'green';
    result_member.textContent = "Valid phone number";
    input_member.classList.remove("error");
  } else {
    const errorCode = iti__member.getValidationError();
    const msg = errorMap[errorCode] || "Invalid number";
    showError__member(msg);
  }
});



// -----------
/*document.addEventListener('DOMContentLoaded', () => {
  var validOnLoad = () => {
    if (iti__member.isValidNumber()) {
      //validMsg.classList.remove("hide");
      const number_member = iti__member.getNumber(intlTelInput.utils.numberFormat.E164);
      const hiddenInputMember = document.querySelector('input[type="hidden"][name="member[phone]"]');
      hiddenInputMember.value = number_member;
      console.log("----------------------->number_member ", number_member)
      result_member.style.color = 'green';
      result_member.textContent = "Valid phone number";
      input_member.classList.remove("error");
    } else {
      const errorCode = iti__member.getValidationError();
      const msg = errorMap[errorCode] || "Invalid number";
      showError__member(msg);
    }
  }
  validOnLoad();
});*/
