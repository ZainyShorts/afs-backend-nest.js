import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { addUserInput } from './inputDto/userInput';
import { UserService } from './user.service';
import { User } from './schema/user.schema';

@Resolver()
export class UserResolver {
    constructor( private userSerice:UserService){}


    @Mutation(() => Boolean, { name: 'addUser' })
    async createUser(
        @Args('addUserInput') addUserInput: addUserInput,
    ): Promise<boolean> {
        return this.userSerice.addUser(addUserInput);
    }

    @Query(() => User, { name: 'getUser' })
    async getUser(
        @Args('deScopeId') deScopeId: string,
    ): Promise<User>{
        return this.userSerice.getUser(deScopeId);
    }
}
