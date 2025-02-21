import { Module } from '@nestjs/common';
import { QuizResolver } from './quiz.resolver';
import { QuizService } from './quiz.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './schema/quiz.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{name:Quiz.name,schema:QuizSchema}])
  ],
  providers: [QuizResolver, QuizService],
})
export class QuizModule {}
