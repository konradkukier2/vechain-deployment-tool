import React, { Component } from 'react';
import './App.css';
import * as wrapper from 'solc/wrapper';
const solc = wrapper(window.Module);

class App extends Component {

  constructor() {
    super();

    if (!window.connex) {
        window.location.href = 'https://env.vechain.org/r/#' + encodeURIComponent(window.location.href)
    }

    this.contractCode = React.createRef();
    this.contractAbi = React.createRef();
    this.contractCompiled = React.createRef();
    this.maxGas = React.createRef();
    this.openTx = React.createRef();
  }

  state = {
    compileError: '',
    deploymentError: '',
    tx: '',
  }

  render() {
    return (
      <div className="app">
        <header className="app-header">
        </header>
        <main className="app-container" style={{ margin: 16 }}>
          <h5>Vechain Smart Contract deployment tool</h5>
          <p>a) Insert smart contract code -> Compile -> Deploy</p>
          <p>b) Insert already compiled code -> Deploy</p>
          <p>Compiler version: 0.5.4 (solc)</p>
          <div className="mdl-textfield mdl-js-textfield">
            <textarea className="mdl-textfield__input" type="text" rows= "4" id="sample5" ref={this.contractCode}></textarea>
            <label className="mdl-textfield__label" htmlFor="sample5">Smart contract code</label>
          </div>

          {
            this.state.compileError ? <p className="error">{this.state.compileError} (check console for details)</p> : null
          }

          <button style={{ color: 'white' }} onClick={this.compile} className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary">
            Compile
          </button>

          <div className="mdl-textfield mdl-js-textfield">
            <textarea className="mdl-textfield__input" type="text" rows= "4" id="abi" ref={this.contractAbi}></textarea>
            <label className="mdl-textfield__label" htmlFor="abi">Contract Abi</label>
          </div>

          <div className="mdl-textfield mdl-js-textfield">
            <textarea className="mdl-textfield__input" type="text" rows= "4" id="bin" ref={this.contractCompiled}></textarea>
            <label className="mdl-textfield__label" htmlFor="bin">Contract Bytecode</label>
          </div>

          <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <input className="mdl-textfield__input" type="text" id="gas" ref={this.maxGas} />
            <label className="mdl-textfield__label" htmlFor="gas">Set maximum gas (optional)</label>
          </div>

          <button
            disabled={this.state.compileError}
            style={{ color: 'white' }}
            onClick={this.deploy}
            className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary"
          >
            Deploy
          </button>

          {
            this.state.deploymentError ? <p className="error">{this.state.deploymentError} (check console for details)</p> : null
          }

          {
            this.state.tx ?
            <div className="transaction-info">
              <span>Transaction sent</span>
              <button
                style={{ color: 'white' }}
                className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary"
                onClick={this.goToInsight}
                ref={this.openTx}
              >
                Open TX
              </button>
            </div> : null
          }

        </main>
      </div>
    );
  }

  goToInsight = () => {
    const url = `https://insight.vecha.in/#/txs/${this.state.tx}`;
    window.open(url, '_blank');
  }

  compile = () => {
    const PLACEHOLDER = 'PLACEHOLDER';
    const contractCode = this.contractCode.current.value;

    const input = {
      language: 'Solidity',
      sources: {
          [PLACEHOLDER]: {
              content: contractCode
          }
      },
      settings: {
          outputSelection: { '*': { '*': [ '*' ] } }
      }
    }

    // compile
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (!output.contracts && output.errors.length) {
      console.error(output);
      this.setState({
        compileError: output.errors[0].message,
      });
    } else {
      const contractName = Object.keys(output.contracts[PLACEHOLDER])[0];

      // fill compiled data
      this.contractAbi.current.value = JSON.stringify(output.contracts.PLACEHOLDER[contractName].abi);
      this.contractCompiled.current.value = output.contracts.PLACEHOLDER[contractName].evm.bytecode.object;

      // label fix
      this.contractAbi.current.parentNode.classList.add('is-dirty');
      this.contractCompiled.current.parentNode.classList.add('is-dirty');
      this.setState({
        compileError: '',
      });
    }

  }

  deploy = () => {
    const signingService = window.connex.vendor.sign('tx');

    if (this.maxGas.current.value) {
      signingService.gas(Number(this.maxGas.current.value));
    }

    signingService.comment('Deploy your smart contract');

    signingService.request([
      {
        to: null,
        value: null,
        data: '0x' + this.contractCompiled.current.value
      }
    ]).then(result => {
      this.setState({ tx: result.txid, deploymentError: '' });
      if (this.openTx) {
        this.openTx.current.scrollIntoView({ behavior: 'smooth'});
      }
    }).catch(error => {
      console.error(error);
      this.setState({
        deploymentError: 'Something went wrong while deploying'
      });
    });
  }

}

export default App;
