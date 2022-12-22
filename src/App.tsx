import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [newValueId, setNewValueId] = useState<string | undefined>(undefined)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  useEffect(() => {
    if (transactions !== null && paginatedTransactions?.data !== undefined) {
      setTransactions([...transactions, ...paginatedTransactions.data])
    } else {
      setTransactions(paginatedTransactions?.data ?? transactionsByEmployee ?? null)
    }
  }, [paginatedTransactions, transactionsByEmployee])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            setNewValueId(newValue?.id)
            setTransactions(null)
            if (newValue === null) {
              return
            } else if (newValue.id.length > 0) {
              await loadTransactionsByEmployee(newValue.id)
            } else {
              await loadAllTransactions()
            }
          }}
        />

        <div className="RampBreak--l" />
        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null &&
            paginatedTransactions &&
            paginatedTransactions?.nextPage !== null && (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  if (newValueId && newValueId?.length > 0) {
                    await loadTransactionsByEmployee(newValueId)
                  } else {
                    await loadAllTransactions()
                  }
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  )
}
