export interface Account {
    id: string,
    name: string,
    balance: number
}

export interface deposit {
    depositId: string,
    accountId: string,
    amount: number,
    simulatedDay: number
}

export interface productPurchased {
    productId: string,
    accountId: string,
    latestSimulatedDay: number,
}
