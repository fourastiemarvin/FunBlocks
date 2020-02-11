import React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { pushState, selectRule } from 'FunBlocks/Actions/Interpreter'
import { Expression, Term, Rule } from 'FunBlocks/AST/Terms'
import Block from 'FunBlocks/Components/Block'
import RuleBlock from 'FunBlocks/Components/RuleBlock'
import { DebuggingContext } from 'FunBlocks/Reducers/Interpreter'
import { RootState } from 'FunBlocks/Store'
import History from './History'

const styles = require('./Workspace.module')

type Props = DebuggingContext & {
  ruleSet: Array<Rule>,
  pushState(state: Term): void,
  selectRule(ruleID: string): void,
}

class DebuggingWorkspace extends React.PureComponent<Props> {

  render() {
    // Create the representation of the currently selected computation state.
    const state = (this.props.historyIndex >= 0) && (
      <Block
        term={ this.props.history[this.props.historyIndex] }
        onClick={ this.didClickOnExpr.bind(this) }
      />
    )

    // Create the representation of the program's rewriting rules.
    const rules = this.props.ruleSet.map((rule) => (
      <RuleBlock
        key={ rule.id }
        rule={ rule }
        selected={ rule.id == this.props.selectedRuleID }
        onClick={ this.didClickOnRule.bind(this) }
      />
    ))

    return (
      <div className={ styles.workspace }>
        <History />
        <div className={ styles.stateViewer }>
          { state }
        </div>
        <div className={ styles.rulesViewer }>
          { rules }
        </div>
      </div>
    )
  }

  componentDidMount() {
    // Add a listener that catches keydown events on the ESC key, to unselect a rule.
    document.addEventListener('keydown', this.didKeydown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.didKeydown)
  }

  private readonly didKeydown = (e: KeyboardEvent) => {
    if (e.keyCode == 27 /* ESC */) {
      this.props.selectRule(null)
    }
  }

  private didClickOnExpr(expr: Expression, startAnimation: (animation: string) => void) {
    // If a rule has been selected, we shall try to apply it on the clicked term to rewrite it.
    const selectedRuleID = this.props.selectedRuleID
    if (selectedRuleID !== null) {
      // Load the rule to apply.
      const rule = this.props.ruleSet.find((r) => r.id == selectedRuleID)
      console.assert(rule !== undefined, `rule not found '${selectedRuleID}'`)

      // Check if the left part of the rule matches the selected term.
      const mapping = expr.match(rule.left)
      if (mapping === null) {
        startAnimation('shake')
        return
      }

      // Compute the substitution.
      const result = rule.right.reifying(mapping)
      const successor = this.props.history[this.props.historyIndex]
        .substituting(expr.id, result)
      this.props.pushState(successor)
    }
  }

  private didClickOnRule(rule: Rule) {
    if (this.props.selectedRuleID !== rule.id) {
      this.props.selectRule(rule.id)
    } else {
      this.props.selectRule(null)
    }
  }

}

const mapStateToProps = (state: RootState) => ({
  ...(state.interpreter.context as DebuggingContext),
  ruleSet: state.ruleSet,
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  pushState: (state: Term) => dispatch(pushState(state)),
  selectRule: (ruleID: string) => dispatch(selectRule(ruleID)),
})

export default connect(mapStateToProps, mapDispatchToProps)(DebuggingWorkspace)