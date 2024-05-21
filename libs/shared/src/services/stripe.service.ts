import Stripe from 'stripe';

export class CommonService {
  private _stripeClient: Stripe;

  constructor() {
    this._stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-08-16',
    });
  }
  async createStripeCustomer(name: string, email: string) {
    const newCustomer = await this._stripeClient.customers.create({
      name,
      email,
    });
    return newCustomer;
  }

  async createBankToken(
    accountNumber: string,
    accountName: string,
    accountType: 'company' | 'individual',
    routingNumber: string
  ) {
    const token: any = await this._stripeClient.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: accountName,
        account_holder_type: accountType,
        routing_number: routingNumber,
        account_number: accountNumber,
      },
    });
    return token;
  }

  async createBankAccount(
    stripeCustomerId: string,
    stripeBankAccountToken: string,
    bankName: string
  ) {
    const newBank = await this._stripeClient.customers.createSource(
      stripeCustomerId,
      {
        source: stripeBankAccountToken,
        metadata: { bank_name: bankName },
      }
    );
    return newBank;
  }

  async verifyBankAccount(
    stripeCustomerId: string,
    stripeBankAccountId: string
  ) {
    const verifyBankAccount = await this._stripeClient.customers.verifySource(
      stripeCustomerId,
      stripeBankAccountId,
      { amounts: [32, 45] }
    );
    return verifyBankAccount;
  }

  async retrieveBankAccount(
    stripeCustomerId: string,
    stripeBankAccountId: string
  ) {
    const bankAccountDetails =
      await this._stripeClient.customers.retrieveSource(
        stripeCustomerId,
        stripeBankAccountId
      );
    return bankAccountDetails;
  }

  async checkStripeCustomerBalance(stripeCustomerId: string) {
    const cashBalance =
      await this._stripeClient.customers.retrieveCashBalance(stripeCustomerId);
    return cashBalance;
  }

  async listBankAccounts(stripeCustomerId: string) {
    const bankAccounts = await this._stripeClient.customers.listSources(
      stripeCustomerId,
      { object: 'bank_account', limit: 10 }
    );
    return bankAccounts;
  }

  async updateBankAccount(
    stripeCustomerId: string,
    stripeBankAccountId: string,
    payload
  ) {
    const { accountName, accountType } = payload;
    const bankAccount = await this._stripeClient.customers.updateSource(
      stripeCustomerId,
      stripeBankAccountId,
      {
        account_holder_name: accountName,
        account_holder_type: accountType,
      }
    );
    return bankAccount;
  }

  async createCardToken(
    cardNumber: string,
    expMonth: string,
    expYear: string,
    cvc: string,
    cardHolderName: string
  ) {
    const token: any = await this._stripeClient.tokens.create({
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc,
        name: cardHolderName,
      },
    });
    return token;
  }

  async addCard(stripeCustomerId: string, stripeCardToken: string) {
    const newCard = await this._stripeClient.customers.createSource(
      stripeCustomerId,
      {
        source: stripeCardToken,
      }
    );
    return newCard;
  }

  async listCards(stripeCustomerId: string) {
    const card = await this._stripeClient.customers.listSources(
      stripeCustomerId,
      {
        object: 'card',
        limit: 10,
      }
    );
    return card;
  }

  async deleteCard(stripeCustomerId: string, cardId: string) {
    const card = await this._stripeClient.customers.deleteSource(
      stripeCustomerId,
      cardId
    );
    return card;
  }
}
