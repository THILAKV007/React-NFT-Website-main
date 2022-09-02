import React from "react";

import "./modal.css";

const Modal = ({ setShowModal }) => {
  return (
    <div className="modal__wrapper">
      <div className="single__modal">
        <span className="close__modal">
          <i class="ri-close-line" onClick={() => setShowModal(false)}></i>
        </span>
        <h6 className="text-center text-light">Buy Your NFT</h6>
        <p className="text-center text-light">
          Price to buy NFT <span className="money">5.89 NEAR</span>
        </p>

        {/* <div className="input__item mb-4">
          <input type="number" placeholder="00 : 00 NEAR" />
        </div> */}

        <div className="input__item mb-3">
          <h6>Enter Quantity, 7 available</h6>
          <input type="number" placeholder="Enter quantity" />
        </div>

        <div className=" d-flex align-items-center justify-content-between">
          <p>You must BUY at price</p>
          <span className="money">5.89 NEAR</span>
        </div>

        <div className=" d-flex align-items-center justify-content-between">
          <p>Service Fee</p>
          <span className="money">0.89 NEAR</span>
        </div>

        <div className=" d-flex align-items-center justify-content-between">
          <p>Total Pay Amount</p>
          <span className="money">5.89 NEAR</span>
        </div>

        <button className="place__bid-btn">BUY NOW</button>
      </div>
    </div>
  );
};

export default Modal;